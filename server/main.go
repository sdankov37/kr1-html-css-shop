// ============================================================
// Перекрёсток — backend на Go
// Отдаёт статику из родительской папки + API корзины.
//
// Скчать Go с оффициального сайта
// Запуск:  cd server → go run .
// Адрес:   http://localhost:8080
//
// API:
//   GET    /api/products?categories=dairy,bakery&min_price=100&max_price=500
//   GET    /api/cart              — товары в корзине текущей сессии
//   POST   /api/cart              — { "product_id": 1, "quantity": 1 }
//   DELETE /api/cart              — очистить корзину
//   DELETE /api/cart/{id}         — удалить один товар
//
// Сессия — через cookie "session". Корзины хранятся in-memory
// (для учебного проекта этого достаточно; при рестарте сервера данные пропадают).
// ============================================================

package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
)

type Product struct {
	ID       int     `json:"id"`
	Title    string  `json:"title"`
	Category string  `json:"category"`
	Price    float64 `json:"price"`
	Image    string  `json:"image"`
	Unit     string  `json:"unit"`
}

type CartItem struct {
	ProductID int `json:"product_id"`
	Quantity  int `json:"quantity"`
}

type CartItemFull struct {
	ProductID int     `json:"product_id"`
	Title     string  `json:"title"`
	Price     float64 `json:"price"`
	Image     string  `json:"image"`
	Quantity  int     `json:"quantity"`
}

// Каталог товаров — синхронизирован с js/data.js и catalog.html
var products = []Product{
	{1, "Молоко «Простоквашино»", "dairy", 89, "milk.jpg", "3,2%, 1 л"},
	{2, "Хлеб «Бородинский»", "bakery", 55, "bread.png", "400 г, нарезной"},
	{3, "Яблоки «Гренни Смит»", "fruits", 149, "apples.jpg", "1 кг"},
	{4, "Сыр «Российский»", "dairy", 399, "cheese.jpg", "45%, 200 г"},
	{5, "Кофе «Jacobs Monarch»", "drinks", 259, "coffee.jpg", "Растворимый, 150 г"},
	{6, "Шоколад «Алёнка»", "sweets", 99, "choko.jpg", "Молочный, 100 г"},
}

type cartStore struct {
	mu    sync.Mutex
	carts map[string][]CartItem
}

var store = &cartStore{carts: make(map[string][]CartItem)}

func findProduct(id int) (Product, bool) {
	for _, p := range products {
		if p.ID == id {
			return p, true
		}
	}
	return Product{}, false
}

func sessionID(w http.ResponseWriter, r *http.Request) string {
	if c, err := r.Cookie("session"); err == nil && c.Value != "" {
		return c.Value
	}
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	id := hex.EncodeToString(b)
	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    id,
		Path:     "/",
		HttpOnly: true,
		MaxAge:   60 * 60 * 24 * 7,
		SameSite: http.SameSiteLaxMode,
	})
	return id
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func productsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	q := r.URL.Query()

	var cats []string
	if raw := q.Get("categories"); raw != "" {
		cats = strings.Split(raw, ",")
	}
	minPrice, _ := strconv.ParseFloat(q.Get("min_price"), 64)
	maxPrice := 1e18
	if v := q.Get("max_price"); v != "" {
		if n, err := strconv.ParseFloat(v, 64); err == nil {
			maxPrice = n
		}
	}

	result := make([]Product, 0)
	for _, p := range products {
		if len(cats) > 0 {
			ok := false
			for _, c := range cats {
				if p.Category == c {
					ok = true
					break
				}
			}
			if !ok {
				continue
			}
		}
		if p.Price < minPrice || p.Price > maxPrice {
			continue
		}
		result = append(result, p)
	}
	writeJSON(w, http.StatusOK, result)
}

func cartHandler(w http.ResponseWriter, r *http.Request) {
	sid := sessionID(w, r)

	switch r.Method {
	case http.MethodGet:
		store.mu.Lock()
		items := append([]CartItem(nil), store.carts[sid]...)
		store.mu.Unlock()

		full := make([]CartItemFull, 0, len(items))
		for _, it := range items {
			if p, ok := findProduct(it.ProductID); ok {
				full = append(full, CartItemFull{
					ProductID: p.ID,
					Title:     p.Title,
					Price:     p.Price,
					Image:     p.Image,
					Quantity:  it.Quantity,
				})
			}
		}
		writeJSON(w, http.StatusOK, map[string]any{"items": full})

	case http.MethodPost:
		var req struct {
			ProductID int `json:"product_id"`
			Quantity  int `json:"quantity"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		if req.Quantity <= 0 {
			req.Quantity = 1
		}
		if _, ok := findProduct(req.ProductID); !ok {
			http.Error(w, "product not found", http.StatusNotFound)
			return
		}
		store.mu.Lock()
		items := store.carts[sid]
		updated := false
		for i := range items {
			if items[i].ProductID == req.ProductID {
				items[i].Quantity += req.Quantity
				updated = true
				break
			}
		}
		if !updated {
			items = append(items, CartItem{req.ProductID, req.Quantity})
		}
		store.carts[sid] = items
		store.mu.Unlock()
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})

	case http.MethodDelete:
		store.mu.Lock()
		delete(store.carts, sid)
		store.mu.Unlock()
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func cartItemHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	sid := sessionID(w, r)
	raw := strings.TrimPrefix(r.URL.Path, "/api/cart/")
	raw = strings.TrimRight(raw, "/")
	id, err := strconv.Atoi(raw)
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	store.mu.Lock()
	items := store.carts[sid]
	kept := make([]CartItem, 0, len(items))
	for _, it := range items {
		if it.ProductID != id {
			kept = append(kept, it)
		}
	}
	store.carts[sid] = kept
	store.mu.Unlock()
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func main() {
	// Статика лежит на уровень выше — в корне проекта
	staticFS := http.FileServer(http.Dir("../"))

	mux := http.NewServeMux()
	mux.HandleFunc("/api/products", productsHandler)
	mux.HandleFunc("/api/cart", cartHandler)
	mux.HandleFunc("/api/cart/", cartItemHandler)
	mux.Handle("/", staticFS)

	addr := ":8080"
	log.Printf("Перекрёсток: http://localhost%s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

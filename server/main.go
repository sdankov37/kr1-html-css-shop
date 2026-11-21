// ============================================================
// Перекрёсток — backend на Go
// 12 товаров, сессионная корзина, каталог с фильтром.
//
// Запуск:  cd server && go run .
// Адрес:   http://localhost:8080/catalog.html
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

var products = []Product{
	{1, "Молоко «Простоквашино»", "dairy", 89, "milk.jpg", "3,2%, 1 л"},
	{2, "Хлеб «Бородинский»", "bakery", 55, "bread.png", "400 г, нарезной"},
	{3, "Яблоки «Гренни Смит»", "fruits", 149, "apples.jpg", "1 кг"},
	{4, "Сыр «Российский»", "dairy", 399, "cheese.jpg", "45%, 200 г"},
	{5, "Кофе «Jacobs Monarch»", "drinks", 259, "coffee.jpg", "Растворимый, 150 г"},
	{6, "Шоколад «Алёнка»", "sweets", 99, "choko.jpg", "Молочный, 100 г"},
	{7, "Кефир «Простоквашино»", "dairy", 79, "kefir.jpg", "1%, 930 мл"},
	{8, "Бананы", "fruits", 99, "banana.jpg", "1 кг"},
	{9, "Сок «Добрый» апельсиновый", "drinks", 129, "juice.jpg", "1 л"},
	{10, "Печенье «Юбилейное»", "sweets", 89, "cookies.jpg", "112 г"},
	{11, "Сметана «Простоквашино»", "dairy", 119, "sour_cream.jpg", "20%, 300 г"},
	{12, "Батон нарезной", "bakery", 45, "baguette.jpg", "400 г"},
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
		Name: "session", Value: id, Path: "/",
		HttpOnly: true, MaxAge: 60 * 60 * 24 * 7,
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
					ProductID: p.ID, Title: p.Title,
					Price: p.Price, Image: p.Image, Quantity: it.Quantity,
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
	mux := http.NewServeMux()
	mux.HandleFunc("/api/products", productsHandler)
	mux.HandleFunc("/api/cart", cartHandler)
	mux.HandleFunc("/api/cart/", cartItemHandler)
	mux.Handle("/", http.FileServer(http.Dir("../")))

	addr := ":8080"
	log.Printf("Перекрёсток: http://localhost%s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}

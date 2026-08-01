package main

import (
	"encoding/json"
	"evigil/internal/orchestrator"
	"log"
	"net/http"
	"time"
)

func main() {
	orch := orchestrator.NewFraudOrchestrator()

	// Direct HTTP REST server for testing
	http.HandleFunc("/api/v1/fraud/evaluate", func(w http.ResponseWriter, r *http.Request) {
		// Enable CORS
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != "POST" {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var payload orchestrator.TransactionPayload
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Ensure defaults if missing
		if payload.TransactionID == "" {
			payload.TransactionID = "tx_mock_generate_" + time.Now().Format("20060102150405")
		}

		result := orch.ProcessTransaction(payload)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	})

	log.Println("[INFO] Project E-Vigil Backend running on HTTP port 8080...")
	log.Println("[INFO] REST API Endpoint: POST http://localhost:8080/api/v1/fraud/evaluate")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

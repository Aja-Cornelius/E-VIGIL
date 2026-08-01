FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.mod ./
# If there were dependencies we'd do: RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o evigil-backend main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/evigil-backend .

EXPOSE 8080

CMD ["./evigil-backend"]

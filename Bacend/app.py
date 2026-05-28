import argparse
import uvicorn # type: ignore

# Stub function to satisfy joblib/pickle when loading the model
def preprocessing_lengkap(text):
    return text

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ChatKu Backend Server")
    parser.add_argument("--host", default="192.168.1.84", help="Host (default: 192.168.1.84)")
    parser.add_argument("--port", type=int, default=8000, help="Port (default: 8000)")
    parser.add_argument("--prod", action="store_true", help="Mode production (multi-worker, tanpa reload)")
    args = parser.parse_args()

    if args.prod:
        print(f"Menjalankan ChatKu dalam mode PRODUCTION")
        print(f"   Host   : {args.host}")
        print(f"   Port   : {args.port}")
        print(f"   Workers: 4")
        uvicorn.run(
            "app.main:app",
            host=args.host,
            port=args.port,
            workers=4,
            log_level="info",
        )
    else:
        print(f"Menjalankan ChatKu dalam mode DEVELOPMENT")
        print(f"   Host : {args.host}")
        print(f"   Port : {args.port}")
        print(f"   Docs : http://{args.host}:{args.port}/docs")
        uvicorn.run(
            "app.main:app",
            host=args.host,
            port=args.port,
            reload=True,
            log_level="debug",
        )

import http.server
import socketserver
import socket
import webbrowser
import os
import sys

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '127.0.0.1'

PORT = 8080
os.chdir(os.path.dirname(os.path.abspath(__file__)))

local_ip = get_local_ip()

print("=" * 60)
print(" 🚀 2026 ACCP/ASHP 重症藥學 150 題 複習測驗系統 伺服器啟動")
print("=" * 60)
print(f" 本機電腦瀏覽網址: http://localhost:{PORT}")
print(f" 手機/平板連線網址: http://{local_ip}:{PORT}")
print(" (手機連線方式: 請確保手機與電腦連接同一個 Wi-Fi，在手機瀏覽器開啟上方網址)")
print(" 提示：在手機 Safari/Chrome 點選「加入主畫面」，即可當成獨立 APP 離線使用！")
print("=" * 60)
print(" 按 Ctrl + C 可關閉伺服器\n")

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

# Open default browser on desktop
try:
    webbrowser.open(f'http://localhost:{PORT}')
except Exception:
    pass

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n伺服器已正常停止。")

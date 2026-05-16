export function buildRedirectHtml(
  deepLink: string,
  isError: boolean,
  message?: string,
): string {
  const title = isError ? 'فشل الربط' : 'تم الربط بنجاح';
  const description = message || 'يتم الآن تحويلك إلى التطبيق...';
  const color = isError ? '#e74c3c' : '#2ecc71';
  const icon = isError ? '❌' : '✅';

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: #333;
        }
        .container {
            background-color: white;
            border-radius: 20px;
            padding: 40px 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            text-align: center;
            max-width: 90%;
            width: 360px;
        }
        .icon {
            font-size: 72px;
            margin-bottom: 24px;
            animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        h1 {
            font-size: 26px;
            margin: 0 0 12px 0;
            color: ${color};
            font-weight: 700;
        }
        p {
            font-size: 16px;
            color: #6c757d;
            margin: 0 0 32px 0;
            line-height: 1.6;
        }
        .btn {
            display: inline-block;
            background-color: #000;
            color: #fff;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            transition: all 0.2s ease;
            width: 100%;
            box-sizing: border-box;
            border: none;
            cursor: pointer;
        }
        .btn:active {
            transform: scale(0.98);
            background-color: #333;
        }
        .spinner {
            border: 3px solid rgba(0,0,0,0.05);
            border-left-color: #000;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes popIn {
            0% { transform: scale(0); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">${icon}</div>
        <h1>${title}</h1>
        <p>${description}</p>
        <div class="spinner" id="spinner"></div>
        <a href="${deepLink}" class="btn">العودة إلى التطبيق</a>
    </div>

    <script>
        setTimeout(function() {
            window.location.href = "${deepLink}";
        }, 1000);
        
        setTimeout(function() {
            document.getElementById('spinner').style.display = 'none';
        }, 3000);
    </script>
</body>
</html>
  `;
}

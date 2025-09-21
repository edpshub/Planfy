// Function for index.html
function savePort() {
    const port = document.getElementById('port-input').value;
    if (port && !isNaN(port)) {
        localStorage.setItem('ownserverPort', port);
        window.location.href = 'choice.html';
    } else {
        alert('有効なサーバー接続キー（ポート番号）を入力してください。');
    }
}

// Functionality for make1.html
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('plan-form');
    if (form) {
        // --- UI Element References ---
        const generateBtn = document.getElementById('generate-btn');
        const statusContainer = document.getElementById('generation-status-container');
        const progressBarFill = document.getElementById('progress-bar-fill');
        const progressText = document.getElementById('progress-text');
        const downloadBtn = document.getElementById('download-btn');

        form.addEventListener('submit', async (event) => {
            event.preventDefault();

            const port = localStorage.getItem('ownserverPort');
            if (!port) {
                alert('サーバー接続キーが設定されていません。最初のページに戻ってください。');
                window.location.href = 'index.html';
                return;
            }

            const url = `https://shard-2509.ownserver.kumassy.com:${port}/generate-pdf`;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // --- 1. UIを「生成中」の状態に切り替え ---
            generateBtn.classList.add('hidden');
            statusContainer.classList.remove('hidden');
            downloadBtn.classList.add('hidden');
            progressText.textContent = 'PDFをサーバーで生成中...';
            progressText.style.color = '#ccc';
            progressBarFill.style.width = '0%';

            // --- 2. プログレスバーのアニメーション（視覚的なフィードバック） ---
            setTimeout(() => { progressBarFill.style.width = '30%'; }, 100);
            setTimeout(() => { progressBarFill.style.width = '60%'; }, 500);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const errorResult = await response.json();
                    throw new Error(errorResult.error || `Server error: ${response.statusText}`);
                }

                // --- 3. 成功時の処理 ---
                progressBarFill.style.width = '100%';
                progressText.textContent = '✅ 生成が完了しました！';
                progressText.style.color = 'var(--neon-color-4)';

                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                
                // ▼▼▼ ここを data.title から data.filename_prefix に修正 ▼▼▼
                const userFilename = data.filename_prefix || 'plan';
                const title = userFilename.replace(/ /g, '_');
                
                downloadBtn.href = downloadUrl;
                downloadBtn.download = `${title}_${Date.now()}.pdf`;
                
                // ダウンロードボタンを表示
                downloadBtn.classList.remove('hidden');

            } catch (error) {
                // --- 4. エラー時の処理 ---
                console.error('Error:', error);
                progressText.textContent = '❌ 生成に失敗しました';
                progressText.style.color = 'red';
                progressBarFill.style.width = '0%';

                setTimeout(() => {
                    statusContainer.classList.add('hidden');
                    generateBtn.classList.remove('hidden');
                }, 2000);

                alert(`企画書の生成に失敗しました。\nエラー: ${error.message}`);
            }
        });
    }
});
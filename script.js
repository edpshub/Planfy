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
            const formData = new FormData(form);  // 修正: FormDataをそのまま使用

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
                console.log('🔄 PDF生成リクエスト開始:', url);
                
                const response = await fetch(url, {
                    method: 'POST',
                    // 修正: Content-Typeヘッダーを削除（FormDataは自動設定）
                    // headers: { 'Content-Type': 'application/json' },  // ← 削除
                    body: formData,  // 修正: FormDataをそのまま送信
                    // 修正: CORS設定を追加
                    mode: 'cors',
                    credentials: 'same-origin',
                    cache: 'no-cache',
                    // 修正: タイムアウト設定（オプション）
                    signal: AbortSignal.timeout(30000)  // 30秒タイムアウト
                });

                console.log('📡 サーバー応答:', response.status, response.statusText);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ サーバーエラー詳細:', errorText);
                    throw new Error(`Server error: ${response.status} - ${errorText}`);
                }

                // --- 3. 成功時の処理 ---
                progressBarFill.style.width = '100%';
                progressText.textContent = '✅ 生成が完了しました！';
                progressText.style.color = 'var(--neon-color-4)';

                const blob = await response.blob();
                console.log('📄 PDF Blob受信:', blob.size, 'bytes');
                
                const downloadUrl = window.URL.createObjectURL(blob);
                
                // ファイル名取得（フォームから）
                const userFilename = formData.get('filename_prefix') || 'plan';
                const title = userFilename.replace(/ /g, '_');
                
                downloadBtn.href = downloadUrl;
                downloadBtn.download = `${title}_${Date.now()}.pdf`;
                
                // ダウンロードボタンを表示
                downloadBtn.classList.remove('hidden');

                console.log('✅ PDF生成・ダウンロード準備完了');

            } catch (error) {
                // --- 4. エラー時の処理 ---
                console.error('❌ 詳細エラー:', error);
                
                // タイムアウトエラーの特別処理
                if (error.name === 'AbortError' || error.message.includes('timeout')) {
                    progressText.textContent = '⏰ サーバー応答がタイムアウトしました';
                } else if (error.message.includes('Failed to fetch')) {
                    progressText.textContent = '🌐 サーバー接続に失敗しました';
                } else {
                    progressText.textContent = '❌ 生成に失敗しました';
                }
                
                progressText.style.color = 'red';
                progressBarFill.style.width = '0%';

                setTimeout(() => {
                    statusContainer.classList.add('hidden');
                    generateBtn.classList.remove('hidden');
                }, 2000);

                alert(`企画書の生成に失敗しました。\nエラー: ${error.message}\n\nサーバーが起動しているか、ポート番号が正しいか確認してください。`);
            }
        });
    }
});
(() => {
    document.getElementById('upload').querySelector('input').addEventListener('change', async function() {
        const file = this.files[0];

        if (file.size > 50 * 1024 * 1024) {
            const chunkSize = 5 * 1024 * 1024; // 5MB
            const totalChunks = Math.ceil(file.size / chunkSize);

            const key = Math.random().toString(36).substring(2);

            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(file.size, start + chunkSize);
                const chunk = file.slice(start, end);

                if (!(await uploadChunk(chunk, key, file.name, i 
                    + 1, totalChunks))) {
                    return;
                }
            }
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/dashboard/upload/single', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            location.reload();
        }
    });

    async function uploadChunk(file, idempotency, originalName, currentChunk, totalChunks) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`/dashboard/upload/chunk?id=${idempotency}&filename=${originalName}&currentChunk=${currentChunk}&totalChunks=${totalChunks}`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            if (data.url) location.reload(); 
            return true;
        }

        return false;
    }

    document.querySelectorAll(".delete-form").forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const response = await fetch('/dashboard/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filename: form.querySelector('input').value }),
            });

            if (response.ok) {
                location.reload();
            }
        });
    })
})();
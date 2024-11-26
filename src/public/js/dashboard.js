(() => {
    document.getElementById('upload').querySelector('input').addEventListener('change', async function() {
        const file = this.files[0];

        if (file.size > 50 * 1024 * 1024) {
            const chunkSize = 5 * 1024 * 1024; // 5MB
            const totalChunks = Math.ceil(file.size / chunkSize);

            for (let i = 1; i <= totalChunks; i++) {
                const start = i * chunkSize;
                const end = Math.min(file.size, start + chunkSize);
                const chunk = file.slice(start, end);

                await uploadChunk(chunk, file.name, i, totalChunks);
            }
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/dashboard/upload', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            location.reload();
        }
    });

    async function uploadChunk(file, originalName, currentChunk, totalChunks) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', originalName);
        formData.append('currentChunk', currentChunk);
        formData.append('totalChunks', totalChunks);

        const response = await fetch('/dashboard/upload/chunk', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data.success && data.url) {
            location.reload(); 
        } 
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
(() => {
    document.getElementById('upload').querySelector('input').addEventListener('change', async function() {
        const file = this.files[0];
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
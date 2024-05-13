function confirmDelete(postId) {
    if(confirm('Bạn có chắc chắn muốn xoá bài viết này?')) {
        fetch('/posts/' + postId + '/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: '_method=DELETE'
        }).then(response => {
            if(response.ok) {
                window.location.reload();
            }
        });
    }
}

function addPageToQuery(page) {
    const currentQuery = document.querySelector('input[name="currentQuery"]').value;
    const separator = currentQuery ? '&' : '?';
    window.location.href = window.location.pathname + '?' + currentQuery + separator + 'page=' + page;
}
//xác nhận xoá
function confirmDelete(newsletterId) {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa newsletter này?');
    if (confirmed) {
        // Nếu người dùng xác nhận, chuyển hướng đến URL xóa chủ đề
        window.location.href = '/newsletter/delete/' + newsletterId;
    }
}
//xác nhận xoá
function confirmDelete(categoryId) {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa danh mục này?');
    if (confirmed) {
        // Nếu người dùng xác nhận, chuyển hướng đến URL xóa chủ đề
        window.location.href = '/categories/delete/' + categoryId;
    }
}
//xác nhận cập nhật
document.getElementById('editCategoryForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Ngăn không cho form gửi đi ngay lập tức
    const confirmed = window.confirm('Bạn có chắc muốn cập nhật chủ đề này?');
    if (confirmed) {
        // Nếu người dùng xác nhận, gửi form
        event.target.submit();
    }
});

// Lắng nghe sự kiện click trên tất cả các nút "Sửa"
document.querySelectorAll('.btn-action').forEach(function(button) {
    button.addEventListener('click', function() {
        // Lấy topic_id từ thuộc tính href của nút
        var categoryId = this.getAttribute('href').split('/').pop();

        // Cập nhật thuộc tính action của form sửa chủ đề
        var editForm = document.getElementById('editCategoryForm');
        editForm.action = '/categories/update/' + categoryId;

        // Cập nhật giá trị của input với id là 'editTopicName'
        var currentCategoryName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
        document.getElementById('editCategoryName').value = currentCategoryName;
    });
});

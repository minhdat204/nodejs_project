//xác nhận cập nhật
document.getElementById('editUserForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Ngăn không cho form gửi đi ngay lập tức
    const confirmed = window.confirm('Bạn có chắc muốn cập nhật?');
    if (confirmed) {
        // Nếu người dùng xác nhận, gửi form
        event.target.submit();
    }
});

// Lắng nghe sự kiện click trên tất cả các nút "Sửa"
document.querySelectorAll('.btn-action').forEach(function(button) {
    button.addEventListener('click', function() {
        // Lấy topic_id từ thuộc tính href của nút
        var user_id = this.getAttribute('href').split('/').pop();

        // Cập nhật thuộc tính action của form sửa chủ đề
        var editForm = document.getElementById('editUserForm');
        editForm.action = '/users/update/' + user_id;

        // Cập nhật giá trị của input với id là 'editTopicName'
        var currentUserName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
        document.getElementById('username').value = currentUserName;
        var currentEmail = this.closest('tr').querySelector('td:nth-child(3)').textContent;
        document.getElementById('email').value = currentEmail;
    });
});
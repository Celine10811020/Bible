window.onload = function() {
    // 获取所有的 thirdLayer 元素
    var thirdLayers = document.querySelectorAll('.thirdLayer');

    // 遍历每个 thirdLayer 元素
    thirdLayers.forEach(function(thirdLayer) {
        var summary = thirdLayer.querySelector('summary'); // 获取 thirdLayer 内部的 summary 元素
        if (summary) {
            var fileName = summary.textContent.trim(); // 获取 summary 的文本内容（文件名）
            var filePath = './Notes/' + fileName + '.txt'; // 拼接文件路径

            // 发起 HTTP GET 请求以获取文本文件内容
            var xhr = new XMLHttpRequest();
            xhr.open('GET', filePath);
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    thirdLayer.innerHTML = xhr.responseText; // 将文本文件内容填充到对应的 div.thirdLayer 中
                }
            };
            xhr.send();
        }
    });
};

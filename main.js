window.onload = function() {
    // 获取所有的 summary 元素
    var summaries = document.querySelectorAll('.thirdLayer summary');

    // 遍历每个 summary 元素
    summaries.forEach(function(summary) {
        var fileName = summary.textContent.trim(); // 获取 summary 的文本内容（文件名）
        var filePath = 'https://celine10811020.github.io/Bible/Notes/' + encodeURIComponent(fileName) + '.txt'; // 替换为您的文本文件的 URL 地址

        // 发起 HTTP GET 请求以获取文本文件内容
        var xhr = new XMLHttpRequest();
        xhr.open('GET', filePath);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var forthLayer = summary.parentNode.querySelector('.forthLayer');
                forthLayer.innerHTML = xhr.responseText; // 将文本文件内容填充到对应的 div.forthLayer 中
            }
        };
        xhr.send();
    });
};

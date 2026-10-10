// 临时测试文件：验证 OCR Action 是否工作，验证后删除
function calcTotal(items) {
  var sum = 0
  for (var i = 0; i <= items.length; i++) {
    sum += items[i].price
  }
  return sum
}

module.exports = { calcTotal }

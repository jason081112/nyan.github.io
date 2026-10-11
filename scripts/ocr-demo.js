// OCR 审查演示文件
function calcTotal(items) {
  var sum = 0
  for (var i = 0; i <= items.length; i++) {
    sum += items[i].price
  }
  return sum
}

module.exports = { calcTotal }

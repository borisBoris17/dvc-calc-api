

function expand(rowCount, columnCount, startAt = 1) {
  var index = startAt
  return Array(rowCount).fill(0).map(v => `(${Array(columnCount).fill(0).map(v => `$${index++}`).join(", ")})`).join(", ")
}

function flatten(arr) {
  var newArr = []
  arr.forEach(v => v.forEach(p => newArr.push(p)))
  return newArr
}

module.exports = {
  expand,
  flatten,
}
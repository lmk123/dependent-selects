module.exports = MultiLevel

var TinyEmitter = require('tiny-emitter')
var resolvedPromise = Promise.resolve()

/**
 * 判断一个变量是不是 null、undefined 或空数组
 * @param v
 * @return {boolean}
 */
function isEmptyArray (v) {
  return !Array.isArray(v) || v.length === 0
}

/**
 * 将一个值转换为 Promise 对象
 * @param v
 * @return {Promise}
 */
function convert2promise (v) {
  return Promise.resolve(v)
}

/**
 * 构造函数
 * @param {function(number, Array, MultiLevel)} query
 * @constructor
 */
function MultiLevel (query) {
  this._query = query
  this.lists = []
  this.selected = []
  this._max = -1
  this.ready = this._loadList()
}

var p = MultiLevel.prototype = Object.create(TinyEmitter.prototype)
p.constructor = MultiLevel

/**
 * 加载下一个下拉框的列表
 * @return {Promise}
 * @private
 */
p._loadList = function () {
  var curIndex = this._max
  var selected = this.selected
  var curSelected = selected[curIndex]
  var next = curIndex + 1

  // 获取下一个列表的选项
  var _this = this
  return convert2promise(this._query(next, selected, this)).then(function (list) {
    // 如果列表为空，说明多级联动已经到了尽头
    if (isEmptyArray(list)) return

    // 如果在查询期间，用户改变了其他下拉框或者重选了当前下拉框的值则不应用此次查询的结果
    if (curIndex !== _this._max || curSelected !== selected[curIndex]) return

    // 新增一个列表
    _this._max = next
    _this.lists.push(list)
    _this.emit('add', list, next, _this)
  })
}

/**
 * 设置一个下拉框的值
 * @param {number} index - 要设置第几个下拉框
 * @param val - 此下拉框的值。如果是 null 则会清空此下拉框的选择项
 * @param {boolean} [preventEvent] - 设为 true 则不会触发 'set' 事件
 * @return {Promise}
 */
p.set = function (index, val, preventEvent) {
  var _this = this
  return this.ready.then(function () {
    var max = _this._max
    if (index > max || index < 0) {
      return Promise.reject(new RangeError('Failed to set the ' + (index + 1) + 'th list\'s value: There are ' + (max + 1) + ' lists only.'))
    }

    var lists = _this.lists
    var list = lists[index]

    var notEmptyVal = val != null

    // 如果在列表中找不到用户要设置的值则 reject
    if (notEmptyVal && list.indexOf(val) < 0) {
      return Promise.reject(new Error('Failed to set the ' + (index + 1) + 'th list\'s value: Can\'t set a value that not exist in the ' + (index + 1) + 'th list.'))
    }

    _this._max = index
    var next = index + 1
    var selected = _this.selected
    if (notEmptyVal) selected[index] = val
    if (!preventEvent) _this.emit('set', val, index)

    // 清空后面几个下拉框的选项和值
    var deletedLists = lists.splice(next)
    var deletedSelected = selected.splice(notEmptyVal ? index + 1 : index)
    var length = deletedLists.length
    if (length) {
      _this.emit('cut-off', length, _this, deletedLists, deletedSelected)
    }
    _this.emit('change', selected, _this)

    if (notEmptyVal) {
      return _this._loadList()
    }
  })
}

/**
 * 循环设置下拉框的值
 * @param {number} index
 * @param {Array|function(number, Array)} choose
 * @return {Promise}
 * @private
 */
p._iterator = function (index, choose) {
  var list = this.lists[index]
  if (isEmptyArray(list)) return resolvedPromise
  var _this = this
  return convert2promise(choose(index, list)).then(function (selectedItem) {
    if (selectedItem == null) return
    return _this.set(index, selectedItem).then(function () {
      return _this._iterator(index + 1, choose)
    })
  })
}

/**
 * 循环设置多级联动的值
 * @param {Array|function(number, Array)} choose - 用于从列表中选出一个值作为列表的选中项，可以返回一个 Promise。
 *   其中第一个参数是一个数字，表明当前需要从第几个下拉框中选值；第二个参数是一个数组，即当前下拉框的选项，由用户的 query 函数返回的。
 * @return {Promise} - promise 会在所有值都填完后返回
 */
p.fill = function (choose) {
  if (Array.isArray(choose)) {
    var selected = choose
    choose = function (index) {
      return selected[index]
    }
  }

  var _this = this
  return this.ready.then(function () {
    return _this._iterator(0, choose)
  })
}

/**
 * 重置选项与选中的值
 * @return {Promise}
 */
p.reset = function () {
  return this.set(0, null)
}

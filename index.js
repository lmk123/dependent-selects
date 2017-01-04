module.exports = MultiLevel

var TinyEmitter = require('tiny-emitter')
var resolvedPromise = Promise.resolve()

/**
 * 判断一个变量是不是 null、undefined 或空数组
 * @param {?Array} v
 * @return {boolean}
 */
function isEmptyArray (v) {
  return v == null || !Array.isArray(v) || v.length === 0
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
 * @param {function(number, MultiLevel)|Object} options
 * @param {function(number, MultiLevel)} options.query
 * @param {boolean} [options.auto=true] - 是否自动加载第一个下拉框列表
 * @constructor
 */
function MultiLevel (options) {
  if (typeof options === 'function') {
    options = {
      query: options
    }
  }

  this._query = options.query
  this._max = -1
  this.lists = []
  this.selected = []

  if (options.auto !== false) {
    this.bootstrap()
  }
}

var p = MultiLevel.prototype = Object.create(TinyEmitter.prototype)
p.constructor = MultiLevel

/**
 * 当一个下拉框的值发生变化之后，使用这个方法会清空后续下拉框的选项和值，并重新请求下一个下拉框的选项
 * @param {number} index
 * @return {Promise}
 * @private
 */
p._changed = function (index) {
  var selected = this.selected
  var lists = this.lists
  var curSelected = selected[index]
  var next = index + 1

  this._max = index

  // 清空后面几个下拉框的选项和值
  var deletedLists = lists.splice(next)
  var deletedSelected = selected.splice(next)
  if (deletedLists.length) {
    this.emit('lists spliced', deletedLists, deletedSelected, this)
  }

  var _this = this

  if (selected[index] == null && index !== -1) {
    return resolvedPromise
  }

  // 获取下一个列表的选项
  return convert2promise(this._query(next, this)).then(function (list) {
    // 如果列表为空，说明多级联动已经到了尽头
    if (isEmptyArray(list)) return

    // 如果在查询期间，用户改变了其他下拉框或者重选了当前下拉框的值则不应用此次查询的结果
    if (index !== _this._max || curSelected !== selected[index]) return

    // 新增一个列表
    _this._max = next
    lists.push(list)
    selected.push(null)
    _this.emit('list added', list, next, _this)
  })
}

/**
 * 设置一个下拉框的值
 * @param {number} index - 要设置第几个下拉框
 * @param {*} val
 * @param {boolean} [preventEvent] - 设为 true 则不会触发 'set value' 事件
 * @return {Promise}
 */
p.set = function (index, val, preventEvent) {
  if (index < 0 || index > this._max) {
    return Promise.reject(new RangeError('当前一共才' + (this._max + 1) + '个下拉框，但是你尝试设置第' + (index + 1) + '个下拉框的值'))
  }

  var list = this.lists[index]
  if (isEmptyArray(list)) {
    return Promise.reject(new Error('第' + (index + 1) + '个下拉框还没有菜单'))
  }

  // 如果在列表中找不到用户要设置的值，则设为 null
  if (list.indexOf(val) < 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('在下拉列表中找不到你要设置的值，所以值被重置为 null')
    }
    val = null
  }

  this.selected[index] = val
  if (!preventEvent) this.emit('set value', index, val)
  return this._changed(index)
}

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
 * @param {Array|function(index, Array)} choose - 用于从列表中选出一个值作为列表的选中项，可以返回一个 Promise。
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
  return this.reset().then(function () {
    return _this._iterator(0, choose)
  })
}

function emptyBootstrap () {
  return resolvedPromise
}

/**
 * 当用户设置了 auto 为 false 时就需要手动调用这个方法加载第一个下拉框列表。
 * @return {Promise}
 */
p.bootstrap = function () {
  this.bootstrap = emptyBootstrap
  return this.reset()
}

/**
 * 重置选项与选中的值并加载第一个下拉框的选项
 * @return {Promise} - promise 会在第一个下拉框的选项加载完后 resolve
 */
p.reset = function () {
  this._max = -1
  return this._changed(-1)
}

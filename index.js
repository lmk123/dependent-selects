import TinyEmitter from 'tiny-emitter'
const resolvedPromise = Promise.resolve()

/**
 * 判断一个变量是不是空数组
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

export default class DependentSelects extends TinyEmitter {
  /**
   * 构造函数
   * @param {function(number, Array, DependentSelects)} query
   */
  constructor (query) {
    super()
    this._query = query
    this.lists = []
    this.selected = []
    this._max = -1
    this.ready = this._loadList()
  }

  /**
   * 加载下一个下拉框的列表
   * @return {Promise}
   * @private
   */
  _loadList () {
    let curIndex = this._max
    const { selected } = this
    const curSelected = selected[curIndex]
    const next = curIndex + 1

    // 获取下一个列表的选项
    return convert2promise(this._query(next, selected, this)).then(list => {
      // 如果列表为空，说明多级联动已经到了尽头
      if (isEmptyArray(list)) return

      // 如果在查询期间，用户改变了其他下拉框或者重选了当前下拉框的值则不应用此次查询的结果
      if (curIndex !== this._max || curSelected !== selected[curIndex]) return

      // 新增一个列表
      this._max = next
      this.lists.push(list)
      this.emit('add', list, next, this)
    })
  }

  /**
   * 设置一个下拉框的值
   * @param {number} index - 要设置第几个下拉框
   * @param val - 此下拉框的值。如果是 null 则会清空此下拉框的选择项
   * @param {boolean} [preventEvent] - 设为 true 则不会触发 'set' 事件
   * @return {Promise}
   */
  set (index, val, preventEvent) {
    return this.ready.then(() => {
      const max = this._max
      if (index > max || index < 0) {
        return Promise.reject(new RangeError(`Failed to set the ${index + 1}th list's value: There are ${max + 1} lists only.`))
      }

      const { lists } = this
      const list = lists[index]

      const notEmptyVal = val != null

      // 如果在列表中找不到用户要设置的值则 reject
      if (notEmptyVal && list.indexOf(val) < 0) {
        return Promise.reject(new RangeError(`Failed to set the ${index + 1}th list's value: Can't set a value that not exist in the ${index + 1}th list.`))
      }

      this._max = index
      const next = index + 1
      const { selected } = this
      if (notEmptyVal) selected[index] = val
      if (!preventEvent) this.emit('set', val, index)

      // 清空后面几个下拉框的选项和值
      const deletedLists = lists.splice(next)
      const deletedSelected = selected.splice(notEmptyVal ? index + 1 : index)
      const { length } = deletedLists
      if (length) {
        this.emit('cut-off', length, this, deletedLists, deletedSelected)
      }
      this.emit('change', selected, this)

      if (notEmptyVal) {
        return this._loadList()
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
  _iterator (index, choose) {
    const list = this.lists[index]
    if (isEmptyArray(list)) return resolvedPromise
    return convert2promise(choose(index, list)).then(selectedItem => {
      if (selectedItem == null) return
      return this.set(index, selectedItem).then(() => {
        return this._iterator(index + 1, choose)
      })
    })
  }

  /**
   * 循环设置多级联动的值
   * @param {Array|function(number, Array)} choose - 用于从列表中选出一个值作为列表的选中项，可以返回一个 Promise。
   *   其中第一个参数是一个数字，表明当前需要从第几个下拉框中选值；第二个参数是一个数组，即当前下拉框的选项，由用户的 query 函数返回的。
   * @return {Promise} - promise 会在所有值都填完后返回
   */
  fill (choose) {
    if (Array.isArray(choose)) {
      const selected = choose
      choose = function (index) {
        return selected[index]
      }
    }

    return this.ready.then(() => {
      return this._iterator(0, choose)
    })
  }

  /**
   * 重置选项与选中的值
   * @return {Promise}
   */
  reset () {
    return this.set(0, null)
  }
}

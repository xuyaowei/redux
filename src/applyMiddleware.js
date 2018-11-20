import compose from './compose'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */
export default function applyMiddleware(...middlewares) {
  return createStore => (...args) => {
    const store = createStore(...args)
    // 不允许在构建中间件时进行调度
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
        `Other middleware would not be applied to this dispatch.`
      )
    }

    const middlewareAPI = {
      getState: store.getState,
      //这里的dispatch是上面定义的dispatch，middleware中传入的也是这个dispatch
      dispatch: (...args) => dispatch(...args)
    }
    // 传入store的middlewareAPI中的dispatch函数事实上是使用了箭头函数对外部的dispatch进行了一层包裹。
    // 这一设计的目的是为了防止中间件直接对dispatch进行修改从而导致错误，同时也使得外部的dispatch需要被预先声明。
    // 为了防止dispatch在构建完成前被调用，在声明时为其赋值一个调用即报错的函数。
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    /**
     *  middleware中间件
     * store：参数实际上传入的是 middlewareAPI。其是一个伪造的 store，提供了类似于getState以及dispatch两个函数。
     * action：参数则是强后的 dispatch函数被调用时传入的 action。
     * next：参数则是指向其前一个中间件生成的函数，包装后的dispatch。
        const logger = store => next => action => {
          console.log('dispatching', action)
          let result = next(action)
          console.log('next state', store.getState())
          return result
        }
    */

    dispatch = compose(...chain)(store.dispatch)
    // compose(a,b)(store.dispatch)
    // ...arg就是store.dispatch
    // function(a,b){
    //   return function (...arg){
    //     a(b(...arg))
    //   }
    // }
    return {
      ...store,
      dispatch
    }
  }
}


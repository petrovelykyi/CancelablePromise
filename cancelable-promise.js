const isFunction = value => typeof value === 'function';

class CancelablePromise {
  constructor(executor) {
    if (!isFunction(executor)) {
      throw new Error('Executor must be a function');
    }

    this.isCanceled = false;

    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.onCancel = [this];

      return executor(value => {
        if (!this.isCanceled) {
          resolve(value);
        } else {
          reject({ isCanceled: true });
        }
      }, reject);
    });
  }

  then(onFulfilled, onRejected) {
    if (this.isCanceled) {
      return this;
    }

    if (onFulfilled && !isFunction(onFulfilled)) {
      throw new Error('onFulfilled must be a function');
    }

    if (onRejected && !isFunction(onRejected)) {
      throw new Error('onRejected must be a function');
    }

    const cancelablePromise = new CancelablePromise((resolve, reject) => {
      this.promise.then(onFulfilled, onRejected).then(resolve, reject).catch(reject);
    });

    cancelablePromise.isCanceled = this.isCanceled;
    cancelablePromise.onCancel = this.onCancel;
    this.onCancel.push(cancelablePromise);

    return cancelablePromise;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  cancel() {
    for (const promise of this.onCancel) {
      promise.isCanceled = true;
      promise.reject({ isCanceled: true });
    }
  }
}

module.exports = CancelablePromise;

import { useState, useEffect } from 'react';

function GlobalState(initialValue) {
    this.value = initialValue;  // Actual value of a global state
    this.subscribers = [];      // List of subscribers

    this.getValue = function () {
        // Get the actual value of a global state
        return this.value;
    }

    this.setValue = function (newState) {
        if (this.getValue() === newState) return; // No new update

        this.value = newState; // Update global state
        this.subscribers.forEach(subscriber => {
            // Notify subscribers thats the global state has changed
            subscriber(this.value);
        });
    }

    this.subscribe = function (itemToSubscribe) {
        if(this.subscribers.indexOf(itemToSubscribe) > -1) return; // Already a subscriber

        this.subscribers.push(itemToSubscribe);
    }

    this.unsubscribe = function (itemToUnsubscribe) {
        this.subscribers = this.subscribers.filter(
            subscriber => subscriber !== itemToUnsubscribe
        );
    }
}

function useGlobalState(globalState) {
    const [, setState] = useState();
    const state = globalState.getValue();

    function reRender(newState) {
        // This will be called when the global state changes
        setGlobalState({});
    }

    useEffect(() => {
        // Subscribe to a global state when a component mounts
        globalState.subscribe(reRender);

        return () => {
            // Unsubscribe from a global state when a component unmounts
            globalState.unsubscribe(reRender);
        }
    })

    function setGlobalState(newState) {
        // Send update request to the global state and let it
        // update itself
        globalState.setValue(newState);
    }

    return [state, setState];
}

export { GlobalState, useGlobalState };
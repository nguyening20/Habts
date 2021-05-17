import { SET_BANNER, REMOVE_BANNER } from "./actionTypes";

export function setBanner(type: string, message: string) {
    return {
        type: SET_BANNER,
        payload: { type, message }
    }
}

export function removeBanner() {
    return {
        type: REMOVE_BANNER
    }
}
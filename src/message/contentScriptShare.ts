import { Adapter, SendMessage, OnMessage, Message } from 'comctx'

export class ProvideContentAdapter implements Adapter {
  sendMessage: SendMessage = (message) => {
    const target = globalThis.document
    if (!target) return
    /**
     * Compatible with Firefox
     * https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts#cloneinto
     */
    const detail =
      // @ts-ignore
      typeof cloneInto === 'function' ? cloneInto(message, target.defaultView) : message

    const CustomEventConstructor = target.defaultView?.CustomEvent ?? CustomEvent
    target.dispatchEvent(new CustomEventConstructor('message', { detail }))
  }
  onMessage: OnMessage = (callback) => {
    const target = globalThis.document
    if (!target) return () => {}
    const handler = (event: Event) => {
      callback((event as CustomEvent<Partial<Message> | undefined>).detail)
    }
    target.addEventListener('message', handler)
    return () => target.removeEventListener('message', handler)
  }
}

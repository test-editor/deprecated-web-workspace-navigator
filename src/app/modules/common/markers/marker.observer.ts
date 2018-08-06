export class MarkerObserver<VALUE_TYPE> {
  path: string
  field: string
  observe: () => Promise<VALUE_TYPE>
  stopOn: (value: VALUE_TYPE) => boolean
}

export class PathValidator {

  /** Matches dot segements such as "xyz/./", "/../" or "../". */
  static readonly dotSegment = /(\/|^)\.+\//;
  static readonly dotSegmentMessage = 'Relative path segments such as "{1}" are not allowed.'

  isValid(input: string): boolean {
    return !PathValidator.dotSegment.test(input);
  }

  getMessage(input: string): string {
    let dotSegmentMatch = PathValidator.dotSegment.exec(input);
    if (dotSegmentMatch) {
      return PathValidator.dotSegmentMessage.replace("{1}", dotSegmentMatch[0]);
    }
    return '';
  }

}

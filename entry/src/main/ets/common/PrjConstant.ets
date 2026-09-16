export class PrjConstant {
  // Emulator and device localhost points to the device itself.
  // Replace this with the LAN IPv4 of the computer running the Java backend.
  static readonly APP_PATH: string = 'http://YOUR_PC_LAN_IP:8081/faceDemo';
  static readonly APP_KEY: string = 'YOUR_APP_KEY';
  static readonly CURRENT_USER_KEY: string = 'natpCurrentUser';
  static readonly ABILITY_CONTEXT_KEY: string = 'natpAbilityContext';
  static readonly LOGIN_URL: string = PrjConstant.APP_PATH + '/userInfo/login';
  static readonly COMPARE_FACE_URL: string = PrjConstant.APP_PATH + '/userInfo/compareFace';
  static readonly EXTRACT_FACE_URL: string = PrjConstant.APP_PATH + '/userInfo/extractFace';
}

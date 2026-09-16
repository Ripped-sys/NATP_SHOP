import { rcp } from '@kit.RemoteCommunicationKit';
import { PrjConstant } from './PrjConstant';
import { ReturnVO } from './ReturnVO';
import { UserInfo } from './UserInfoEntity';

interface UserPayload {
  id?: number;
  userId?: number;
  username?: string;
  userName?: string;
  phone?: string;
  mobile?: string;
  faceToken?: string;
}

export class HTTPMgr {
  private static session: rcp.Session = rcp.createSession();

  private static parseResponse(response: rcp.Response): ReturnVO<UserPayload> {
    try {
      const value: object | null = response.toJSON();
      if (!value) { return { code: -1, msg: '响应解析失败' }; }
      return value as ReturnVO<UserPayload>;
    } catch (_) {
      return { code: -1, msg: '响应解析失败' };
    }
  }

  static async login(phone: string, password: string): Promise<ReturnVO<UserPayload>> {
    try {
      const form: rcp.Form = new rcp.Form({ phone: phone, password: password, appKey: PrjConstant.APP_KEY });
      return HTTPMgr.parseResponse(await HTTPMgr.session.post(PrjConstant.LOGIN_URL, form));
    } catch (_) {
      return { code: -1, msg: '网络请求失败，请检查后端地址' };
    }
  }

  static async faceLogin(faceBytes: ArrayBuffer): Promise<ReturnVO<UserPayload>> {
    try {
      const form: rcp.MultipartForm = new rcp.MultipartForm({
        faceFile: { contentType: 'image/jpeg', remoteFileName: 'face.jpg', contentOrPath: { content: faceBytes } },
        appKey: PrjConstant.APP_KEY
      });
      return HTTPMgr.parseResponse(await HTTPMgr.session.post(PrjConstant.COMPARE_FACE_URL, form));
    } catch (_) {
      return { code: -1, msg: '网络请求失败，请检查后端地址' };
    }
  }

  static async extractFace(faceBytes: ArrayBuffer, userId: number): Promise<ReturnVO<UserPayload>> {
    try {
      const form: rcp.MultipartForm = new rcp.MultipartForm({
        faceFile: { contentType: 'image/jpeg', remoteFileName: 'face.jpg', contentOrPath: { content: faceBytes } },
        appKey: PrjConstant.APP_KEY,
        userId: String(userId)
      });
      return HTTPMgr.parseResponse(await HTTPMgr.session.post(PrjConstant.EXTRACT_FACE_URL, form));
    } catch (_) {
      return { code: -1, msg: '网络请求失败，请检查后端地址' };
    }
  }

  static parseUser(resp: ReturnVO<UserPayload>): UserInfo | undefined {
    const item: UserPayload | undefined = resp.content;
    const id: number = item ? (item.id ?? item.userId ?? 0) : 0;
    if (!item || id <= 0) { return undefined; }
    return {
      id: id,
      username: item.username ?? item.userName ?? item.phone ?? 'NATP MEMBER',
      phone: item.phone ?? item.mobile ?? '',
      faceToken: item.faceToken
    };
  }
}

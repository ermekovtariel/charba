import React, { useEffect, Fragment } from 'react';
import { ZoomMtg } from '@zoomus/websdk';

const Meeting = ({ payload }) => {
  useEffect(() => {
    const fetchDaat = async () => {
      const { ZoomMtg } = await import('@zoomus/websdk');
      ZoomMtg.setZoomJSLib('https://source.zoom.us/lib', '/av');

      ZoomMtg.preLoadWasm();
      ZoomMtg.prepareWebSDK();

      ZoomMtg.generateSDKSignature({
        meetingNumber: payload.meetingNumber,
        role: payload.role,
        sdkKey: payload.sdkKey,
        sdkSecret: payload.sdkSecret,
        success: function (signature) {
          ZoomMtg.init({
            leaveUrl: payload.leaveUrl,
            success: function (data) {
              ZoomMtg.join({
                meetingNumber: payload.meetingNumber,
                signature: signature.result,
                userName: payload.userName,
                userEmail: payload.userEmail,
                passWord: payload.passWord,
                tk: '',
                success: () => console.log('---> joined'),
                error: (error) => console.log(error),
              });
            },
            error: (error) => console.log(error),
          });
        },
        error: (error) => console.log(error),
      });
    };
    fetchDaat();
  }, []);

  return <h1>meeting will be here</h1>;
};
export default Meeting;

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CalendarLiveActivity, NSObject)

// 更新后的方法签名，必须与 Swift 中的参数一一对应
RCT_EXTERN_METHOD(startActivity:(NSString *)title
                  startTime:(double)startTime
                  endTime:(double)endTime
                  location:(NSString *)location
                  leftButtonText:(NSString *)leftButtonText
                  leftButtonType:(NSString *)leftButtonType
                  rightButtonText:(NSString *)rightButtonText
                  rightButtonType:(NSString *)rightButtonType)

RCT_EXTERN_METHOD(endActivity)

@end

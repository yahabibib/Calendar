import Foundation
import ActivityKit

@objc(CalendarLiveActivity)
class CalendarLiveActivity: NSObject {

    // 定义暴露给 React Native 的方法
    // 包含 8 个参数：基础信息 + 左右按钮的文案和类型
    @objc(startActivity:startTime:endTime:location:leftButtonText:leftButtonType:rightButtonText:rightButtonType:)
    func startActivity(_ title: String,
                       startTime: Double,
                       endTime: Double,
                       location: String?,
                       leftButtonText: String?,
                       leftButtonType: String?,
                       rightButtonText: String?,
                       rightButtonType: String?
    ) {
        // 1. 检查系统权限
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            print("Live Activities are not enabled by user settings.")
            return
        }

        // 2. 数据转换
        // JS 传入的是毫秒 (Date.now())，Swift 需要秒，所以除以 1000
        let startDateObj = Date(timeIntervalSince1970: startTime / 1000)
        let endDateObj = Date(timeIntervalSince1970: endTime / 1000)

        // 3. 组装静态数据 (Attributes)
        // 这些数据在活动启动后一般不会变
        let attributes = CalendarAttributes(
            title: title,
            location: location,
            leftButtonText: leftButtonText,
            leftButtonType: leftButtonType,
            rightButtonText: rightButtonText,
            rightButtonType: rightButtonType
        )

        // 4. 组装动态数据 (ContentState)
        // 主要是结束时间，用于驱动倒计时和进度条
        let contentState = CalendarAttributes.ContentState(endTime: endDateObj)

        // 5. 计算自动销毁时间 (Stale Date)
        // 策略：会议结束 5 分钟后 (300秒) 自动从锁屏移除
        let dismissalDate = endDateObj.addingTimeInterval(300)

        do {
            // 6. 请求启动 Activity
            // pushType: nil 表示这是一个本地 Activity，不需要远程推送更新
            let activity = try Activity<CalendarAttributes>.request(
                attributes: attributes,
                contentState: contentState,
                pushType: nil
            )

            print("✅ Live Activity Started: \(activity.id)")

            // 7. 关键逻辑：立即更新一次以设置 staleDate (过期策略)
            // iOS 系统会在到达 dismissalDate 后，自动移除这个灵动岛
            Task {
                await activity.update(
                    ActivityContent(
                        state: contentState,
                        staleDate: dismissalDate
                    ),
                    alertConfiguration: nil
                )
            }

        } catch {
            print("❌ Error starting Live Activity: \(error.localizedDescription)")
        }
    }

    @objc(endActivity)
    func endActivity() {
        // 结束当前 App 所有的灵动岛活动
        Task {
            for activity in Activity<CalendarAttributes>.activities {
                await activity.end(dismissalPolicy: .immediate)
            }
            print("🛑 All Live Activities ended.")
        }
    }
}

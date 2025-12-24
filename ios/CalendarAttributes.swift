import ActivityKit
import Foundation

public struct CalendarAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var endTime: Date
        // ✨ 动态状态：按钮文案可以随时变（比如倒计时结束变成“签到”）
        // 这里为了简单，我们把按钮配置放在静态属性里，如果需要变，放在这里即可
    }

    // 静态属性 (启动后一般不变)
    public var title: String
    public var location: String?
    
    // ✨✨✨ 新增：左右按钮的配置 ✨✨✨
    // 如果传 nil，就不显示那个按钮
    public var leftButtonText: String?
    public var leftButtonType: String? // 用来判断点击后干什么 (例如 "map", "call")
    
    public var rightButtonText: String?
    public var rightButtonType: String?
}

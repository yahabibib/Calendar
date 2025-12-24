import ActivityKit
import WidgetKit
import SwiftUI

struct CalendarWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: CalendarAttributes.self) { context in
            // ==========================================
            // 📺 1. 锁屏 / 通知中心 UI (Lock Screen)
            // ==========================================
            VStack(spacing: 0) {
                HStack(alignment: .center) {
                    // 左侧：信息流
                    VStack(alignment: .leading, spacing: 4) {
                        Text(context.attributes.title)
                            .font(.subheadline)
                            .foregroundColor(.gray.opacity(0.8))
                        
                        // 地点 (Hero)
                        if let location = context.attributes.location, !location.isEmpty {
                            HStack(alignment: .firstTextBaseline, spacing: 4) {
                                Image(systemName: "mappin.and.ellipse")
                                    .font(.title3)
                                    .foregroundColor(.red)
                                Text(location)
                                    .font(.system(size: 26, weight: .heavy, design: .rounded))
                                    .foregroundColor(.white)
                                    .lineLimit(1)
                            }
                        } else {
                            Text("进行中")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                    }
                    
                    Spacer()
                    
                    // 右侧：纯粹的倒计时
                    Text(timerInterval: Date()...context.state.endTime, countsDown: true)
                        .font(.system(size: 28, weight: .semibold).monospacedDigit())
                        .foregroundColor(.yellow)
                }
                .padding(.horizontal, 8)
                .padding(.top, 12)
                
                Spacer() // 撑开中间，把按钮推到底部
                
                // ✨✨✨ 底部：动态操作区 (Action Bar) ✨✨✨
                HStack(spacing: 12) {
                    // 左按钮
                    if let text = context.attributes.leftButtonText, let type = context.attributes.leftButtonType {
                        // Link 会打开 App，URL Scheme 可以在 JS 端监听
                        Link(destination: URL(string: "calendarapp://action/\(type)")!) {
                            HStack {
                                // 根据 type 简单换个图标 (逻辑写死在 View 里是为了预览，实际可更灵活)
                                Image(systemName: type == "map" ? "location.fill" : "star.fill")
                                Text(text)
                            }
                            .font(.system(size: 14, weight: .bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.white.opacity(0.15))
                            .foregroundColor(.white)
                            .clipShape(Capsule())
                        }
                    }
                    
                    // 右按钮
                    if let text = context.attributes.rightButtonText, let type = context.attributes.rightButtonType {
                        Link(destination: URL(string: "calendarapp://action/\(type)")!) {
                            HStack {
                                Image(systemName: type == "call" ? "phone.fill" : "arrow.right.circle.fill")
                                Text(text)
                            }
                            .font(.system(size: 14, weight: .bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.blue) // 右侧按钮高亮
                            .foregroundColor(.white)
                            .clipShape(Capsule())
                        }
                    }
                }
                .padding(.bottom, 12)
                .padding(.horizontal, 8)
            }
            .padding(16)
            .activityBackgroundTint(Color.black.opacity(0.85))

        } dynamicIsland: { context in
            // ==========================================
            // 🏝️ 2. 灵动岛 UI
            // ==========================================
            DynamicIsland {
                // Expanded
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 12) {
                        // 上半部分：信息
                        HStack {
                            if let loc = context.attributes.location {
                                Image(systemName: "mappin.circle.fill").foregroundColor(.red)
                                Text(loc).fontWeight(.bold).foregroundColor(.white)
                            }
                            Spacer()
                            Text(timerInterval: Date()...context.state.endTime, countsDown: true)
                                .monospacedDigit().foregroundColor(.yellow)
                        }
                        
                        // ✨ 下半部分：按钮 (Expanded 也可以放按钮)
                        HStack(spacing: 12) {
                            if let lText = context.attributes.leftButtonText {
                                Link(destination: URL(string: "calendarapp://action")!) {
                                    Text(lText)
                                        .font(.caption.bold())
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 6)
                                        .background(Color.white.opacity(0.2))
                                        .clipShape(Capsule())
                                }
                            }
                            if let rText = context.attributes.rightButtonText {
                                Link(destination: URL(string: "calendarapp://action")!) {
                                    Text(rText)
                                        .font(.caption.bold())
                                        .frame(maxWidth: .infinity)
                                        .padding(.vertical, 6)
                                        .background(Color.blue)
                                        .clipShape(Capsule())
                                }
                            }
                        }
                    }
                    .padding(.top, 8)
                }
            } compactLeading: {
               // ... 保持原有设计 (定位图标)
               if let _ = context.attributes.location {
                   Image(systemName: "mappin.and.ellipse").foregroundColor(.red)
               } else {
                   Image(systemName: "calendar").foregroundColor(.blue)
               }
            } compactTrailing: {
               // ... 保持原有设计 (倒计时)
               Text(timerInterval: Date()...context.state.endTime, countsDown: true)
                   .monospacedDigit()
                   .font(.system(size: 13, weight: .bold))
                   .foregroundColor(.yellow)
                   .frame(maxWidth: 48)
                   .minimumScaleFactor(0.8)
            } minimal: {
               Image(systemName: "mappin").foregroundColor(.red)
            }
        }
    }
}

// 👇 预览代码：模拟两个不同的场景
#if DEBUG
struct CalendarWidgetLiveActivity_Previews: PreviewProvider {
    // 场景 1：线下会议
    static let attrOffline = CalendarAttributes(
        title: "产品评审",
        location: "302 会议室",
        leftButtonText: "导航", leftButtonType: "map",
        rightButtonText: "联系", rightButtonType: "call"
    )
    
    // 场景 2：线上会议 (测试按钮变化)
    static let attrOnline = CalendarAttributes(
        title: "远程面试",
        location: "腾讯会议",
        leftButtonText: "复制号", leftButtonType: "copy",
        rightButtonText: "入会", rightButtonType: "video"
    )

    static let contentState = CalendarAttributes.ContentState(endTime: Date().addingTimeInterval(1800))

    static var previews: some View {
        attrOffline
            .previewContext(contentState, viewKind: .content)
            .previewDisplayName("📺 线下会议 (导航+联系)")
        
        attrOnline
            .previewContext(contentState, viewKind: .content)
            .previewDisplayName("📺 线上会议 (复制+入会)")
    }
}
#endif

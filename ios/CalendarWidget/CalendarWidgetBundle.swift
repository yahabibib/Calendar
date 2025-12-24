//
//  CalendarWidgetBundle.swift
//  CalendarWidget
//
//  Created by 易汉斌 on 2025/12/24.
//

import WidgetKit
import SwiftUI

@main
struct CalendarWidgetBundle: WidgetBundle {
    var body: some Widget {
        CalendarWidget()
        CalendarWidgetControl()
        CalendarWidgetLiveActivity()
    }
}

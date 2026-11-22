# Zig

## Flags → tagged union + exhaustive switch
```zig
// before
const Player = struct { playing: bool, paused: bool, pos_ms: u64, err: ?[]const u8 };
```
```zig
// after
const Player = union(enum) {
    stopped,
    playing: struct { pos_ms: u64 },
    paused: struct { pos_ms: u64 },
    failed: []const u8,
};

const Event = enum { play, pause, stop };

fn transition(p: Player, e: Event) !Player {
    return switch (p) {
        .stopped => switch (e) {
            .play => .{ .playing = .{ .pos_ms = 0 } },
            else => error.InvalidTransition,
        },
        .playing => |s| switch (e) {
            .pause => .{ .paused = .{ .pos_ms = s.pos_ms } },
            .stop => .stopped,
            else => error.InvalidTransition,
        },
        .paused => |s| switch (e) {
            .play => .{ .playing = .{ .pos_ms = s.pos_ms } },
            .stop => .stopped,
            else => error.InvalidTransition,
        },
        .failed => error.InvalidTransition,
    };
}
```
The `switch` on a `union(enum)` is exhaustive: add a state, and the compiler tells you every place to handle it.

## Branch ladder → comptime table
```zig
const Op = enum { add, sub, mul };
const OPS = std.EnumArray(Op, *const fn (i64, i64) i64).init(.{
    .add = add,
    .sub = sub,
    .mul = mul,
});
```

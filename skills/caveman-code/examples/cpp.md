# C++

## Flags → std::variant
```cpp
// before
struct Request { bool sent = false, failed = false; std::string error; int status = 0; };
```
```cpp
// after
struct Idle {};
struct Sent { std::chrono::steady_clock::time_point at; };
struct Failed { std::string error; };
struct Done { int status; std::string body; };

using Request = std::variant<Idle, Sent, Failed, Done>;

template <class... F> struct overloaded : F... { using F::operator()...; };

std::string describe(const Request& r) {
    return std::visit(overloaded{
        [](const Idle&)     { return std::string{"idle"}; },
        [](const Sent&)     { return std::string{"waiting"}; },
        [](const Failed& f) { return "failed: " + f.error; },
        [](const Done& d)   { return "done " + std::to_string(d.status); },
    }, r);
}
```
A missing alternative in `overloaded` is a compile error.

## Branch ladder → static table
```cpp
enum class Level { Debug, Info, Warn, Error };
constexpr std::array<std::string_view, 4> LEVEL_NAMES{"debug", "info", "warn", "error"};
```

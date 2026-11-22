# C

## Flags → enum + transition table
```c
/* before */
struct door { int is_open; int is_locked; int is_moving; };
```
```c
/* after */
typedef enum { CLOSED, OPENING, OPEN, CLOSING, LOCKED, STATE_COUNT } state_t;
typedef enum { EV_OPEN, EV_CLOSE, EV_DONE, EV_LOCK, EV_UNLOCK, EVENT_COUNT } event_t;

#define INVALID STATE_COUNT

/* every cell is filled: a zero default would silently mean CLOSED */
static const state_t TRANSITIONS[STATE_COUNT][EVENT_COUNT] = {
    /*             EV_OPEN  EV_CLOSE EV_DONE  EV_LOCK  EV_UNLOCK */
    [CLOSED]  = { OPENING, INVALID, INVALID, LOCKED,  INVALID },
    [OPENING] = { INVALID, CLOSING, OPEN,    INVALID, INVALID },
    [OPEN]    = { INVALID, CLOSING, INVALID, INVALID, INVALID },
    [CLOSING] = { OPENING, INVALID, CLOSED,  INVALID, INVALID },
    [LOCKED]  = { INVALID, INVALID, INVALID, INVALID, CLOSED  },
};

int transition(state_t *s, event_t e) {
    state_t next = TRANSITIONS[*s][e];
    if (next == INVALID) return -1;
    *s = next;
    return 0;
}
```

## Per-state data → tagged union
```c
typedef struct {
    enum { MSG_TEXT, MSG_IMAGE, MSG_QUIT } kind;
    union {
        struct { const char *body; } text;
        struct { const unsigned char *px; int w, h; } image;
    };
} msg_t;
```

## Branch ladder → function-pointer table
```c
typedef int (*cmd_fn)(int argc, char **argv);
static const struct { const char *name; cmd_fn fn; } COMMANDS[] = {
    { "add",  cmd_add  },
    { "list", cmd_list },
    { "rm",   cmd_rm   },
};
```

import time


class Notification:
    def __init__(self, user_id, message, channel="email"):
        self.user_id = user_id
        self.message = message
        self.channel = channel
        self.is_sent = False
        self.is_failed = False
        self.is_retrying = False
        self.attempts = 0
        self.last_error = None
        self.sent_at = None


class Notifier:
    MAX_ATTEMPTS = 3

    def __init__(self, transport, clock=time.time):
        self.transport = transport
        self.clock = clock
        self.outbox = []

    def enqueue(self, notification):
        self.outbox.append(notification)

    def flush(self):
        """Try to send every pending notification once."""
        for n in self.outbox:
            if n.is_sent:
                continue
            if n.is_failed and not n.is_retrying:
                continue
            try:
                n.attempts += 1
                self.transport(n.channel, n.user_id, n.message)
                n.is_sent = True
                n.is_failed = False
                n.is_retrying = False
                n.sent_at = self.clock()
            except Exception as e:
                n.last_error = str(e)
                n.is_failed = True
                if n.attempts < self.MAX_ATTEMPTS:
                    n.is_retrying = True
                else:
                    n.is_retrying = False

    def pending(self):
        return [n for n in self.outbox if not n.is_sent and (not n.is_failed or n.is_retrying)]

    def failed(self):
        return [n for n in self.outbox if n.is_failed and not n.is_retrying]

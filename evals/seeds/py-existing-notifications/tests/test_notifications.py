import unittest
from src.notifications import Notification, Notifier


class NotifierTest(unittest.TestCase):
    def test_sends(self):
        sent = []
        n = Notifier(lambda ch, u, m: sent.append((ch, u, m)), clock=lambda: 100)
        n.enqueue(Notification(1, "hi"))
        n.flush()
        self.assertEqual(sent, [("email", 1, "hi")])
        self.assertEqual(n.pending(), [])

    def test_gives_up_after_three_attempts(self):
        def boom(*a):
            raise RuntimeError("down")
        n = Notifier(boom)
        note = Notification(1, "hi")
        n.enqueue(note)
        for _ in range(5):
            n.flush()
        self.assertEqual(note.attempts, 3)
        self.assertEqual(n.failed(), [note])


if __name__ == "__main__":
    unittest.main()

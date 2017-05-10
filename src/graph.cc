#include <assert.h>
#include <stdlib.h>
#include <string.h>

#include "nan.h"

namespace graph {

using namespace node;
using namespace v8;


static int graph_compare_users(const void* a, const void* b) {
  const uint32_t* ai = reinterpret_cast<const uint32_t*>(a);
  const uint32_t* bi = reinterpret_cast<const uint32_t*>(b);
  uint32_t user_a = ai[0];
  uint32_t user_b = bi[0];

  return user_a - user_b;
}


NAN_METHOD(Sort) {
  char* buf = Buffer::Data(info[0]);
  size_t len = Buffer::Length(info[0]);

  qsort(buf, len / 8, 8, graph_compare_users);
}


static unsigned int dedup_users(uint32_t* users, unsigned int count) {
  qsort(users, count, sizeof(*users), graph_compare_users);

  unsigned int j = 0;
  for (unsigned int i = 1; i < count; i++) {
    uint32_t user = users[i];

    if (users[j] == user)
      continue;

    users[++j] = user;
  }

  return j + 1;
}


NAN_METHOD(Dedup) {
  const char* buf = Buffer::Data(info[0]);
  size_t len = Buffer::Length(info[0]);

  assert(len >= 4);
  uint32_t* copy = new uint32_t[len / 4];
  memcpy(copy, buf, len);

  unsigned int j = dedup_users(copy, len / 4);

  info.GetReturnValue().Set(
      Nan::CopyBuffer(reinterpret_cast<char*>(copy),
                      j * sizeof(*copy)).ToLocalChecked());
  delete[] copy;
}


static int binary_search(const uint32_t* links, unsigned int count,
                         uint32_t user) {
  int l;
  int r;
  int m;

  l = 0;
  r = (int) count - 1;
  while (l <= r) {
    uint32_t m_user;
    int cmp;

    /* NOTE: no overflow possible here because of constraints on memory */
    m = (l + r) >> 1;
    m_user = links[m * 2];
    cmp = (int) user - (int) m_user;

    if (cmp == 0)
      goto found;

    if (cmp < 0)
      r = m - 1;
    else
      l = m + 1;
  }

  return -1;

found:
  /* Find the first link */
  while (m > 0 && links[m * 2 - 2] == user)
    m--;
  return m;
}


NAN_METHOD(BFS) {
  const char* buf = Buffer::Data(info[0]);
  size_t len = Buffer::Length(info[0]);
  uint32_t to = info[1]->Uint32Value();
  uint32_t max_depth = info[2]->Uint32Value();
  unsigned int count = len / 8;

  assert(count > 0);
  assert(max_depth > 0);
  uint32_t* out = new uint32_t[2 * count];
  size_t out_count = 1;

  out[0] = to;
  const uint32_t* links = reinterpret_cast<const uint32_t*>(buf);
  for (uint32_t d = 0; d < max_depth; d++) {
    size_t count_copy = out_count;

    for (size_t off = 0; off < count_copy; off++) {
      uint32_t curr = out[off];
      int i = binary_search(links, count, curr);
      if (i == -1)
        continue;

      for (unsigned int j = i; j < count; j++) {
        uint32_t user;
        uint32_t follower;

        user = links[j * 2];
        follower = links[j * 2 + 1];

        if (user != curr)
          break;

        assert(out_count < 2 * count);
        out[out_count++] = follower;
      }

      out_count = off + dedup_users(out + off, out_count - off);
    }
    out_count = dedup_users(out, out_count);
  }

  info.GetReturnValue().Set(
      Nan::CopyBuffer(reinterpret_cast<char*>(out),
                      out_count * sizeof(*out)).ToLocalChecked());
  delete[] out;
}


NAN_METHOD(BinarySearch) {
  const char* buf = Buffer::Data(info[0]);
  size_t len = Buffer::Length(info[0]);
  uint32_t to = info[1]->Uint32Value();

  const uint32_t* links = reinterpret_cast<const uint32_t*>(buf);
  size_t count = len / 8;

  int i = binary_search(links, count, to);
  if (i == -1) {
    info.GetReturnValue().Set(Nan::False());
    return;
  }

  unsigned int j = i + 1;
  for (; j < count; j++)
    if (links[j * 2] > to)
      break;

  Local<Array> out = Nan::New<Array>();

  out->Set(0, Nan::New(i * 8));
  out->Set(1, Nan::New(j * 8));

  info.GetReturnValue().Set(out);
}


NAN_MODULE_INIT(Init) {
  Nan::SetMethod(target, "sort", Sort);
  Nan::SetMethod(target, "dedup", Dedup);
  Nan::SetMethod(target, "bfs", BFS);
  Nan::SetMethod(target, "binarySearch", BinarySearch);
}

}  // namespace graph

NODE_MODULE(graph, graph::Init)

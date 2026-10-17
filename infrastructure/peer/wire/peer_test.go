package wire

import (
	"crypto/sha256"
	"fmt"
	"testing"

	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protodesc"
)

// The module rename may change GoPackage, but no field, message, enum or wire
// namespace may change. This digest records the complete pre-rename contract.
func TestStablePeerWireContract(t *testing.T) {
	descriptor := protodesc.ToFileDescriptorProto(File_liapoldus_peer_v1_peer_proto)
	descriptor.Options.GoPackage = nil
	encoded, err := (proto.MarshalOptions{Deterministic: true}).Marshal(descriptor)
	if err != nil {
		t.Fatal(err)
	}
	const expected = "8a0f2a6d835dba0b7aea6d2e1e9b499258947ad1e590574a8a970fb7ff374a99"
	if digest := fmt.Sprintf("%x", sha256.Sum256(encoded)); digest != expected {
		t.Fatalf("peer wire contract digest = %s, want %s", digest, expected)
	}
}

func TestDescriptorAndOpaquePayloadRoundTrip(t *testing.T) {
	input := &CallRequest{Method: "consumer.method", Payload: []byte{0, 255, 17}}
	descriptor := input.ProtoReflect().Descriptor()
	if descriptor.FullName() != "liapoldus.peer.v1.CallRequest" || descriptor.Fields().ByName("method").Number() != 1 || descriptor.Fields().ByName("payload").Number() != 2 {
		t.Fatal("wire descriptor changed")
	}
	encoded, err := proto.Marshal(input)
	if err != nil {
		t.Fatal(err)
	}
	if fmt.Sprintf("%x", encoded) != "0a0f636f6e73756d65722e6d6574686f64120300ff11" {
		t.Fatal("opaque method/payload encoding changed")
	}
	var output CallRequest
	if err := proto.Unmarshal(encoded, &output); err != nil {
		t.Fatal(err)
	}
	if !proto.Equal(input, &output) {
		t.Fatal("wire payload changed")
	}
}

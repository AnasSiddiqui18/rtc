import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Socket } from "socket.io-client";
import { useState } from "react";

type CreateRoomDialogProps = {
  socket: Socket | null;
};

const roomSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Room name must be at least 3 characters." }),
});

type RoomSchema = z.infer<typeof roomSchema>;

export function CreateRoomDialog({ socket }: CreateRoomDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<RoomSchema>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(values: RoomSchema) {
    if (!socket) {
      console.error("Socket not connected");
      return;
    }

    console.log("Room created with values:", values);
    socket.emit("create-room", { name: values.name });
    form.reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Room</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new room</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter room name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Create
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

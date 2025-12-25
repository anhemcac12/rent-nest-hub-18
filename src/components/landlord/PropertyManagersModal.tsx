import { useState, useEffect } from 'react';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Property } from '@/types/property';
import { PropertyManager } from '@/types/landlord';
import { getPropertyManagers, addPropertyManager, removePropertyManager, findUserByEmail } from '@/lib/mockDatabase';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface PropertyManagersModalProps {
  open: boolean;
  onClose: () => void;
  property: Property;
}

export function PropertyManagersModal({ open, onClose, property }: PropertyManagersModalProps) {
  const [managers, setManagers] = useState<PropertyManager[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (open && property) {
      setManagers(getPropertyManagers(property.id));
    }
  }, [open, property]);

  const handleAddManager = () => {
    if (!newEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address.',
        variant: 'destructive',
      });
      return;
    }

    const user = findUserByEmail(newEmail);
    if (!user) {
      toast({
        title: 'User Not Found',
        description: 'No user found with this email address.',
        variant: 'destructive',
      });
      return;
    }

    const existingManager = managers.find(m => m.userId === user.id);
    if (existingManager) {
      toast({
        title: 'Already a Manager',
        description: 'This user is already a manager for this property.',
        variant: 'destructive',
      });
      return;
    }

    const newManager = addPropertyManager(property.id, user);
    if (newManager) {
      setManagers(prev => [...prev, newManager]);
      setNewEmail('');
      setIsAdding(false);
      toast({
        title: 'Manager Added',
        description: `${user.fullName} has been added as a manager.`,
      });
    }
  };

  const handleRemoveManager = (managerId: string) => {
    const success = removePropertyManager(property.id, managerId);
    if (success) {
      setManagers(prev => prev.filter(m => m.id !== managerId));
      toast({
        title: 'Manager Removed',
        description: 'The manager has been removed from this property.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Property Managers</DialogTitle>
          <DialogDescription>
            Manage who can help manage "{property.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {managers.length === 0 && !isAdding ? (
            <div className="text-center py-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <UserPlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                No property managers added yet
              </p>
              <Button variant="outline" onClick={() => setIsAdding(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Manager
              </Button>
            </div>
          ) : (
            <>
              {/* Current Managers */}
              <div className="space-y-3">
                {managers.map((manager) => (
                  <div 
                    key={manager.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={manager.userAvatar} />
                        <AvatarFallback>
                          {manager.userName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{manager.userName}</p>
                        <p className="text-xs text-muted-foreground">{manager.userEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {manager.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemoveManager(manager.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Manager */}
              {isAdding ? (
                <div className="space-y-3 pt-4 border-t">
                  <Label>Add New Manager</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddManager()}
                    />
                    <Button onClick={handleAddManager}>Add</Button>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setIsAdding(false);
                      setNewEmail('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsAdding(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manager
                </Button>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

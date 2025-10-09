import torch
import torch.nn as nn
import torchvision.models as models

class SteeringModel(nn.Module):
    def __init__(self):
        super(SteeringModel, self).__init__()
        self.resnet = models.resnet18(pretrained=False)
        num_ftrs = self.resnet.fc.in_features
        self.resnet.fc = nn.Identity()
        self.fc1 = nn.Linear(num_ftrs + 2, 128)  # +2 for throttle, speed
        self.fc2 = nn.Linear(128, 1)

    def forward(self, x, extra_features):
        x = self.resnet(x)
        x = torch.cat((x, extra_features), dim=1)
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        return x

def load_model(model_path, device):
    model = SteeringModel().to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()
    return model

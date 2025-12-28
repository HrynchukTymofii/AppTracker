import SwiftUI
import FamilyControls

@available(iOS 15.0, *)
struct FamilyActivityPickerView: View {
  @State private var selection = FamilyActivitySelection()
  var onSelectionChange: (FamilyActivitySelection) -> Void

  var body: some View {
    VStack {
      Text("Select Apps to Block")
        .font(.headline)
        .padding()

      FamilyActivityPicker(selection: $selection)
        .onChange(of: selection) { newSelection in
          onSelectionChange(newSelection)
        }
    }
  }
}

// Wrapper to expose to React Native
@available(iOS 15.0, *)
class FamilyActivityPickerViewController: UIViewController {
  var onSelectionChange: ((FamilyActivitySelection) -> Void)?

  override func viewDidLoad() {
    super.viewDidLoad()

    let pickerView = FamilyActivityPickerView { [weak self] selection in
      self?.onSelectionChange?(selection)
    }

    let hostingController = UIHostingController(rootView: pickerView)
    addChild(hostingController)
    view.addSubview(hostingController.view)

    hostingController.view.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
      hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])

    hostingController.didMove(toParent: self)
  }
}

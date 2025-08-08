import os

# Define the folder/file structure
structure = {
    "public": ["placeholder.svg", "robots.txt"],
    "src": {
        "components": {
            "chat": ["ChatWindow.tsx", "SettingsDialog.tsx", "Sidebar.tsx"],
            "ui": [
                "accordion.tsx", "alert-dialog.tsx", "alert.tsx", "aspect-ratio.tsx",
                "avatar.tsx", "badge.tsx", "breadcrumb.tsx", "button.tsx", "calendar.tsx",
                "card.tsx", "carousel.tsx", "chart.tsx", "checkbox.tsx", "collapsible.tsx",
                "command.tsx", "context-menu.tsx", "dialog.tsx", "drawer.tsx", "dropdown-menu.tsx",
                "form.tsx", "hover-card.tsx", "input-otp.tsx", "input.tsx", "label.tsx",
                "menubar.tsx", "navigation-menu.tsx", "pagination.tsx", "popover.tsx",
                "progress.tsx", "radio-group.tsx", "resizable.tsx", "scroll-area.tsx",
                "select.tsx", "separator.tsx", "sheet.tsx", "sidebar.tsx", "skeleton.tsx",
                "slider.tsx", "sonner.tsx", "switch.tsx", "table.tsx", "tabs.tsx",
                "textarea.tsx", "toast.tsx", "toaster.tsx", "toggle-group.tsx", "toggle.tsx",
                "tooltip.tsx", "use-toast.ts"
            ]
        },
        "hooks": ["use-mobile.tsx", "use-toast.ts"],
        "lib": ["llm.ts", "settings.ts", "supabaseClient.ts", "utils.ts"],
        "pages": ["Index.tsx", "NotFound.tsx"],
        "types": ["chat.ts"],
        "root_files": ["App.css", "App.tsx", "index.css", "main.tsx"]
    },
    "root_files": [
        ".gitignore", "components.json", "eslint.config.js", "index.html", "package.json",
        "postcss.config.js", "README.md", "tailwind.config.ts", "tsconfig.app.json",
        "tsconfig.json", "tsconfig.node.json", "vite.config.ts"
    ]
}

def create_structure(base_path, struct):
    """
    Recursively create folders and files based on the provided structure.
    """
    for key, value in struct.items():
        if isinstance(value, list):
            # Create directory if not already at the root_files level
            if key != "root_files":
                dir_path = os.path.join(base_path, key)
                os.makedirs(dir_path, exist_ok=True)
                for file in value:
                    open(os.path.join(dir_path, file), 'w').close()
            else:
                # root level files
                for file in value:
                    open(os.path.join(base_path, file), 'w').close()
        elif isinstance(value, dict):
            # Create folder and recurse
            dir_path = os.path.join(base_path, key)
            os.makedirs(dir_path, exist_ok=True)
            create_structure(dir_path, value)

if __name__ == "__main__":
    base_directory = os.getcwd()  # You can change this to any desired path
    create_structure(base_directory, structure)
    print("✅ Folder and file structure created successfully!")

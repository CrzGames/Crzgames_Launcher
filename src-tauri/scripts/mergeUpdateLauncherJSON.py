import json
import asyncio
import aiofiles

class UpdaterConfig:
    def __init__(self):
        self.version = ""
        self.platforms = {}

async def merge_json_files(output_file: str, files: list):
    merged_content = UpdaterConfig()

    for file_path in files:
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as file:
            content = await file.read()
            json_content = json.loads(content)
            merged_content.version = json_content['version']
            merged_content.platforms.update(json_content['platforms'])

    async with aiofiles.open(output_file, 'w', encoding='utf-8') as file:
        await file.write(json.dumps({
            'version': merged_content.version,
            'platforms': merged_content.platforms
        }, indent=2))

async def main():
    output_file_path = 'dist/updater-launcher.json'
    input_files = [
        'macos/updater-launcher.json',
        'linux/updater-launcher.json',
        'windows/updater-launcher.json'
    ]

    await merge_json_files(output_file_path, input_files)

if __name__ == '__main__':
    asyncio.run(main())

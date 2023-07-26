package fi.villesalonen.laputin;

import fi.villesalonen.laputin.records.FileRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class FileController {
    private final FileService fileService;

    @Autowired
    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @GetMapping("/files")
    public List<FileRecord> listAll() {
        return fileService.getFiles();
    }
}
